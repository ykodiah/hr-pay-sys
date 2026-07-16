/**
 * Public careers job listings (no auth).
 * GET /api/careers/jobs?company_id=&job=
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/recruitment/job-lookup"

export async function GET(req: NextRequest) {
  try {
    const client = await createClient()
    const sp = new URL(req.url).searchParams
    const companyId = sp.get("company_id")
    const jobKey = sp.get("job")

    if (jobKey) {
      let query = client
        .from("recruitment_job_postings")
        .select(
          "id, company_id, slug, title, description, requirements, benefits, salary_min, salary_max, currency, location, department, employment_type, status, published_at, expires_at, views_count",
        )
        .eq("status", "published")

      if (isUuid(jobKey)) query = query.eq("id", jobKey)
      else query = query.eq("slug", jobKey)

      if (companyId) query = query.eq("company_id", companyId)

      const { data, error } = await query.maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data) return NextResponse.json({ error: "Job not found" }, { status: 404 })

      // Best-effort view counter
      void client
        .from("recruitment_job_postings")
        .update({ views_count: (data.views_count ?? 0) + 1, updated_at: new Date().toISOString() })
        .eq("id", data.id)

      const { data: company } = await client
        .from("companies")
        .select("id, name")
        .eq("id", data.company_id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        job: { ...data, views_count: (data.views_count ?? 0) + 1, company_name: company?.name ?? null },
      })
    }

    let listQuery = client
      .from("recruitment_job_postings")
      .select(
        "id, company_id, slug, title, description, salary_min, salary_max, currency, location, department, employment_type, status, published_at, expires_at, views_count",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100)

    if (companyId) listQuery = listQuery.eq("company_id", companyId)

    const { data, error } = await listQuery
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const companyIds = Array.from(new Set((data ?? []).map((j) => j.company_id).filter(Boolean)))
    const companyNames = new Map<string, string>()
    if (companyIds.length) {
      const { data: companies } = await client.from("companies").select("id, name").in("id", companyIds)
      for (const c of companies ?? []) companyNames.set(c.id, c.name)
    }

    return NextResponse.json({
      success: true,
      jobs: (data ?? []).map((j) => ({
        ...j,
        company_name: companyNames.get(j.company_id) ?? null,
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
