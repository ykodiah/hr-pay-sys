/**
 * POST /api/recruitment/onboarding/convert
 * body: { checklist_id, preview?: true, confirm?: true, overrides?, include_payroll?, link_existing? }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"
import {
  buildHireDraftFromChecklist,
  convertChecklistToEmployee,
} from "@/lib/recruitment/convert-to-employee"

function db() {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.isDemo) {
      return NextResponse.json(
        { error: "Employee conversion is disabled in demo mode." },
        { status: 403 },
      )
    }

    const client: any = await db()
    const authClient = await createClient()
    const body = await req.json()
    const checklistId = String(body.checklist_id || body.id || "").trim()
    if (!checklistId) {
      return NextResponse.json({ error: "checklist_id is required" }, { status: 400 })
    }

    let companyId =
      body.company_id ||
      (await resolveCompanyId(authClient, user.id, user))?.companyId ||
      null
    if (!companyId) {
      return NextResponse.json({ error: "Unable to resolve company" }, { status: 400 })
    }

    // Preview only
    if (body.preview || !body.confirm) {
      const preview = await buildHireDraftFromChecklist(client, checklistId, companyId)
      return NextResponse.json({
        success: true,
        mode: "preview",
        draft: preview.draft,
        conflicts: preview.conflicts,
        missing_fields: preview.missing_fields,
        checklist: {
          id: preview.checklist.id,
          candidate_name: preview.checklist.candidate_name,
          status: preview.checklist.status,
          employee_id: preview.checklist.employee_id,
          progress: preview.checklist.progress,
        },
        guidance:
          "Review the prefilled employee details, then confirm. Payroll/bank details are optional and not invented.",
      })
    }

    const result = await convertChecklistToEmployee(client, {
      companyId,
      checklistId,
      actorId: user.id,
      overrides: body.overrides || undefined,
      include_payroll: Boolean(body.include_payroll),
      link_existing: body.link_existing !== false,
    })

    return NextResponse.json({
      success: true,
      mode: "converted",
      action: result.action,
      employee: result.employee,
      draft: result.draft,
      employee_list_path: "/app/employees",
      message:
        result.action === "linked_existing"
          ? "Existing employee matched by email and linked to this onboarding."
          : result.action === "already_converted"
            ? "This hire was already added to the employee list."
            : "Employee created and added to the employee list.",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Conversion failed" },
      { status: 500 },
    )
  }
}
