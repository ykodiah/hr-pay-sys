/**
 * Public careers job listings (no auth).
 * GET /api/careers/jobs?company_id=&job=  (job = id | slug | short_code)
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/recruitment/job-lookup"
import { formatCompanyAddress } from "@/lib/exports/company-branding"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

function companyPayload(company: any) {
  if (!company) return null
  return {
    id: company.id,
    name: company.name ?? null,
    address: company.address ?? null,
    city: company.city ?? null,
    region: company.region ?? null,
    country: company.country ?? null,
    phone: company.phone_number ?? company.phone ?? null,
    email: company.email_address ?? company.email ?? null,
    logo_url: company.logo_url ?? null,
    website: company.website ?? null,
    formatted_address: formatCompanyAddress(company),
  }
}

export async function GET(req: NextRequest) {
  try {
    const client: any = await db()
    const sp = new URL(req.url).searchParams
    const companyId = sp.get("company_id")
    const jobKey = (sp.get("job") || sp.get("code") || "").trim()

    if (jobKey) {
      let query = client
        .from("recruitment_job_postings")
        .select(
          "id, company_id, slug, short_code, title, description, public_summary, requirements, benefits, salary_min, salary_max, currency, location, department, employment_type, status, published_at, expires_at, views_count, applications_count",
        )
        .eq("status", "published")

      if (isUuid(jobKey)) query = query.eq("id", jobKey)
      else if (/^[A-Z0-9]{6,12}$/i.test(jobKey) && !jobKey.includes("-")) {
        query = query.or(`short_code.eq.${jobKey},short_code.eq.${jobKey.toUpperCase()},slug.eq.${jobKey}`)
      } else {
        query = query.eq("slug", jobKey)
      }

      if (companyId) query = query.eq("company_id", companyId)

      let { data, error } = await query.maybeSingle()

      // Fallback: try short_code alone if composite or failed
      if ((!data || error) && !isUuid(jobKey)) {
        const retry = await client
          .from("recruitment_job_postings")
          .select(
            "id, company_id, slug, short_code, title, description, public_summary, requirements, benefits, salary_min, salary_max, currency, location, department, employment_type, status, published_at, expires_at, views_count, applications_count",
          )
          .eq("status", "published")
          .ilike("short_code", jobKey)
          .maybeSingle()
        if (retry.data) {
          data = retry.data
          error = null
        }
      }

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data) return NextResponse.json({ error: "Job not found or not published" }, { status: 404 })

      void client
        .from("recruitment_job_postings")
        .update({ views_count: (data.views_count ?? 0) + 1, updated_at: new Date().toISOString() })
        .eq("id", data.id)

      const { data: company } = await client.from("companies").select("*").eq("id", data.company_id).maybeSingle()
      const companyInfo = companyPayload(company)

      return NextResponse.json({
        success: true,
        job: {
          ...data,
          views_count: (data.views_count ?? 0) + 1,
          company_name: companyInfo?.name ?? null,
          company: companyInfo,
          apply_path: data.short_code ? `/j/${data.short_code}` : `/careers?job=${encodeURIComponent(data.slug || data.id)}`,
        },
      })
    }

    let listQuery = client
      .from("recruitment_job_postings")
      .select(
        "id, company_id, slug, short_code, title, description, public_summary, salary_min, salary_max, currency, location, department, employment_type, status, published_at, expires_at, views_count, applications_count",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100)

    if (companyId) listQuery = listQuery.eq("company_id", companyId)

    const { data, error } = await listQuery
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const companyIds = Array.from(new Set((data ?? []).map((j: any) => j.company_id).filter(Boolean)))
    const companyMap = new Map<string, any>()
    if (companyIds.length) {
      const { data: companies } = await client.from("companies").select("*").in("id", companyIds)
      for (const c of companies ?? []) companyMap.set(c.id, companyPayload(c))
    }

    return NextResponse.json({
      success: true,
      jobs: (data ?? []).map((j: any) => {
        const company = companyMap.get(j.company_id) ?? null
        return {
          ...j,
          company_name: company?.name ?? null,
          company,
          apply_path: j.short_code ? `/j/${j.short_code}` : `/careers?job=${encodeURIComponent(j.slug || j.id)}`,
        }
      }),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
