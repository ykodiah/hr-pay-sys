import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentCompanyId } from "@/lib/communication/integrations"
import { handleCommunicationEvent } from "@/lib/communication/automations"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { companyId } = await getCurrentCompanyId(supabase)
    const payload = await request.json()

    if (!payload?.type) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 })
    }

    const result = await handleCommunicationEvent(supabase, companyId, payload)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error("[communication/events][POST]", error)
    return NextResponse.json({ error: error.message || "Failed to process communication event" }, { status: 500 })
  }
}
