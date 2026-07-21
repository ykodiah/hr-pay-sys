import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const client = await createClient()
    let companyId = new URL(req.url).searchParams.get("company_id")
    if (!companyId) {
      companyId = (await resolveCompanyId(client, user.isDemo ? null : user.id))?.companyId ?? null
    }
    if (!companyId) return NextResponse.json({ error: "company_id required" }, { status: 400 })

    const status = new URL(req.url).searchParams.get("status")
    let query = client
      .from("recruitment_requisitions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
    if (status && status !== "all") query = query.eq("status", status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, requisitions: data ?? [] })
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

    const payload = {
      company_id: companyId,
      title: body.title,
      department: body.department ?? null,
      location: body.location ?? null,
      employment_type: body.employment_type ?? "Full-time",
      priority: body.priority ?? "medium",
      status: body.status ?? "pending_approval",
      budget_min: Number(body.budget_min ?? 0),
      budget_max: Number(body.budget_max ?? 0),
      currency: body.currency ?? "GHS",
      headcount: Number(body.headcount ?? 1),
      requester_name: body.requester_name ?? null,
      requester_employee_id: body.requester_employee_id ?? null,
      deadline: body.deadline ?? null,
      description: body.description ?? null,
      requirements: body.requirements ?? [],
      ai_analysis: body.ai_analysis ?? {},
      created_by: user.isDemo ? null : user.id,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await client.from("recruitment_requisitions").insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, requisition: data }, { status: 201 })
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
      "department",
      "location",
      "employment_type",
      "priority",
      "status",
      "budget_min",
      "budget_max",
      "headcount",
      "deadline",
      "description",
      "requirements",
      "ai_analysis",
      "requester_name",
      "requester_employee_id",
    ]) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    if (body.status === "approved") {
      patch.approved_by = user.isDemo ? null : user.id
      patch.approved_at = new Date().toISOString()
    }

    const { data, error } = await client
      .from("recruitment_requisitions")
      .update(patch)
      .eq("id", body.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, requisition: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
