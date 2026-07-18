// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, ensureArray, jsonError } from "@/lib/settings/resolve-tenant"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { data: subsidiaries, error } = await service
      .from("subsidiaries")
      .select("*")
      .eq("company_id", companyId)
      .order("name")

    if (error) throw error

    const headers = [
      "Name",
      "Tax ID",
      "SSNIT Number",
      "Address",
      "Phone",
      "Email",
      "Industry",
      "Status",
      "Divisions",
      "Departments",
      "Locations",
    ]

    const csvData =
      subsidiaries?.map((sub) => [
        sub.name || "",
        sub.tax_id || "",
        sub.ssnit_number || "",
        sub.address || "",
        sub.phone_number || "",
        sub.email_address || "",
        sub.industry || "",
        sub.status || "",
        ensureArray(sub.divisions).join("; "),
        ensureArray(sub.departments).join("; "),
        ensureArray(sub.locations).join("; "),
      ]) || []

    const csvContent = [headers.join(","), ...csvData.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))].join(
      "\n",
    )

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="subsidiaries_template.csv"',
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return jsonError(error, "Failed to export subsidiaries")
  }
}
