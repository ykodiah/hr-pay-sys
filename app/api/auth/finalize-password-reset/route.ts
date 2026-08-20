import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Clears portal must_change_password after a successful Auth password reset. */
export async function POST(_req: NextRequest) {
  try {
    const client = await createClient()
    if ((client as any).__isMock) {
      return NextResponse.json({ error: "Not available in demo mode" }, { status: 400 })
    }
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: "Reset session expired. Request a new link." }, { status: 401 })
    }

    const service = createServiceClient()
    await service
      .from("employee_portal_accounts")
      .update({
        must_change_password: false,
        status: "active",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", data.user.id)

    await service.auth.admin.updateUserById(data.user.id, {
      user_metadata: {
        ...(data.user.user_metadata || {}),
        must_change_password: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Could not finalize password reset" }, { status: 400 })
  }
}
