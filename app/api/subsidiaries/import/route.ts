// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const companyIdFromForm = (formData.get("company_id") as string) || null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const ctx = await resolveTenantContext(request, companyIdFromForm)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: "Invalid file format" }, { status: 400 })
    }

    const dataLines = lines.slice(1)
    const now = new Date().toISOString()
    const subsidiaries = []

    for (const line of dataLines) {
      const fields = line.split(",").map((field) => field.replace(/"/g, "").trim())

      if (fields.length >= 8 && fields[0]) {
        subsidiaries.push({
          company_id: companyId,
          name: fields[0],
          tax_id: fields[1],
          ssnit_number: fields[2],
          address: fields[3],
          phone_number: fields[4],
          email_address: fields[5],
          industry: fields[6],
          status: fields[7] || "active",
          divisions: fields[8] ? fields[8].split(";").map((d) => d.trim()) : [],
          departments: fields[9] ? fields[9].split(";").map((d) => d.trim()) : [],
          locations: fields[10] ? fields[10].split(";").map((l) => l.trim()) : [],
          created_at: now,
          updated_at: now,
        })
      }
    }

    if (subsidiaries.length === 0) {
      return NextResponse.json({ error: "No valid data found" }, { status: 400 })
    }

    const { error } = await service.from("subsidiaries").insert(subsidiaries)
    if (error) throw error

    return NextResponse.json({
      message: `Successfully imported ${subsidiaries.length} subsidiaries`,
      count: subsidiaries.length,
    })
  } catch (error) {
    console.error("Import error:", error)
    return jsonError(error, "Failed to import subsidiaries")
  }
}
