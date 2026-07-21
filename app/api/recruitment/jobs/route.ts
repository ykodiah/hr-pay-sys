import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import { slugify } from "@/lib/recruitment/defaults"
import { generateJobShortCode } from "@/lib/recruitment/short-code"

async function ensureUniqueShortCode(client: any, preferred?: string | null) {
  let code = (preferred || generateJobShortCode(8)).toUpperCase()
  for (let i = 0; i < 8; i++) {
    const { data } = await client
      .from("recruitment_job_postings")
      .select("id")
      .eq("short_code", code)
      .maybeSingle()
    if (!data) return code
    code = generateJobShortCode(8)
  }
  return generateJobShortCode(10)
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    const sp = new URL(req.url).searchParams
    let companyId = sp.get("company_id")
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    let query = client
      .from("recruitment_job_postings")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    const status = sp.get("status")
    if (status && status !== "all") query = query.eq("status", status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Attach application counts
    const ids = (data ?? []).map((j) => j.id)
    const counts = new Map<string, number>()
    if (ids.length) {
      const { data: apps } = await client
        .from("recruitment_applications")
        .select("job_posting_id")
        .in("job_posting_id", ids)
      for (const a of apps ?? []) {
        counts.set(a.job_posting_id, (counts.get(a.job_posting_id) ?? 0) + 1)
      }
    }

    return NextResponse.json({
      success: true,
      jobs: (data ?? []).map((j) => ({ ...j, applications_count: counts.get(j.id) ?? 0 })),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    const body = await req.json()
    let companyId = body.company_id
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId
    }
    if (!companyId || !body.title) {
      return NextResponse.json({ error: "company_id and title required" }, { status: 400 })
    }

    const status = body.status ?? "draft"
    const shortCode = await ensureUniqueShortCode(client, body.short_code)
    const payload = {
      company_id: companyId,
      requisition_id: body.requisition_id ?? null,
      slug: body.slug || slugify(body.title),
      short_code: shortCode,
      title: body.title,
      description: body.description ?? "",
      public_summary: body.public_summary ?? null,
      requirements: body.requirements ?? [],
      benefits: body.benefits ?? [],
      salary_min: Number(body.salary_min ?? 0),
      salary_max: Number(body.salary_max ?? 0),
      currency: body.currency ?? "GHS",
      location: body.location ?? null,
      department: body.department ?? null,
      employment_type: body.employment_type ?? "Full-time",
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      expires_at: body.expires_at ?? null,
      created_by: user.isDemo ? null : user.id,
      updated_at: new Date().toISOString(),
    }

    let { data, error } = await client.from("recruitment_job_postings").insert(payload).select().single()
    // Pre-085 DBs may not have short_code / public_summary yet
    if (error && /short_code|public_summary|applications_count/i.test(error.message || "")) {
      const { short_code: _sc, public_summary: _ps, ...legacy } = payload as any
      const retry = await client.from("recruitment_job_postings").insert(legacy).select().single()
      data = retry.data
      error = retry.error
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, job: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of [
      "title",
      "description",
      "requirements",
      "benefits",
      "salary_min",
      "salary_max",
      "location",
      "department",
      "employment_type",
      "status",
      "expires_at",
      "requisition_id",
    ]) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    if (body.status === "published") patch.published_at = new Date().toISOString()
    if (body.public_summary !== undefined) patch.public_summary = body.public_summary
    if (body.action === "duplicate") {
      const { data: src } = await client.from("recruitment_job_postings").select("*").eq("id", body.id).single()
      if (!src) return NextResponse.json({ error: "Job not found" }, { status: 404 })
      const { id: _id, created_at: _c, updated_at: _u, published_at: _p, short_code: _sc, ...rest } = src
      const { data, error } = await client
        .from("recruitment_job_postings")
        .insert({
          ...rest,
          title: `${src.title} (Copy)`,
          slug: slugify(`${src.title}-copy`),
          short_code: await ensureUniqueShortCode(client),
          status: "draft",
          published_at: null,
          views_count: 0,
          applications_count: 0,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, job: data })
    }

    // Ensure published jobs always have a short share code
    if (body.status === "published" || body.action === "ensure_short_code") {
      const { data: current } = await client
        .from("recruitment_job_postings")
        .select("short_code")
        .eq("id", body.id)
        .maybeSingle()
      if (!current?.short_code) {
        patch.short_code = await ensureUniqueShortCode(client)
      }
    }

    const { data, error } = await client
      .from("recruitment_job_postings")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, job: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const client = await createClient()
    const { error } = await client
      .from("recruitment_job_postings")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
