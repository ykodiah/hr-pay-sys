import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { importAttendanceCsv } from "@/lib/services/attendance-ops-service"

export async function POST(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const contentType = request.headers.get("content-type") || ""
    let csvText = ""
    let filename = "upload.csv"
    let deviceId: string | null = null

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      const file = form.get("file")
      deviceId = (form.get("device_id") as string) || null
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "CSV file is required" }, { status: 400 })
      }
      filename = (file as File).name || filename
      csvText = await (file as File).text()
    } else {
      const body = await request.json().catch(() => ({}))
      csvText = body.csv || body.csvText || ""
      filename = body.filename || filename
      deviceId = body.device_id || null
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "Empty CSV content" }, { status: 400 })
    }

    const result = await importAttendanceCsv({
      companyId: ctx.companyId,
      csvText,
      deviceId,
      uploadedBy: ctx.userId,
      filename,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return jsonError(err, "Attendance import failed")
  }
}
