/**
 * GET   /api/reports/[id]         — fetch a single saved report record
 * PATCH /api/reports/[id]         — update status (submit / file with ref)
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fileReport } from "@/lib/services/reports/engine"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await client
      .from("compliance_reports")
      .select("*, report_audit(*)")
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Log view action
    await client.rpc("log_report_action", {
      p_report_id:  id,
      p_action:     "viewed",
      p_actor_id:   user.id,
      p_actor_name: null,
      p_notes:      null,
    })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { action, submission_ref, notes } = body

    if (action === "file") {
      if (!submission_ref) {
        return NextResponse.json({ error: "submission_ref is required" }, { status: 400 })
      }
      await fileReport(id, submission_ref, user.id)
      return NextResponse.json({ success: true, message: "Report marked as filed" })
    }

    if (action === "submit") {
      await client
        .from("compliance_reports")
        .update({ status: "submitted", submitted_at: new Date().toISOString(), notes })
        .eq("id", id)

      await client.rpc("log_report_action", {
        p_report_id:  id,
        p_action:     "submitted",
        p_actor_id:   user.id,
        p_actor_name: null,
        p_notes:      notes ?? null,
      })

      return NextResponse.json({ success: true, message: "Report marked as submitted" })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
