import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Fetch subsidiaries data
    const { data: subsidiaries, error } = await supabase.from("subsidiaries").select("*").order("name")

    if (error) throw error

    // Create Excel-like CSV format
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
        Array.isArray(sub.divisions) ? sub.divisions.join("; ") : "",
        Array.isArray(sub.departments) ? sub.departments.join("; ") : "",
        Array.isArray(sub.locations) ? sub.locations.join("; ") : "",
      ]) || []

    // Convert to CSV
    const csvContent = [headers.join(","), ...csvData.map((row) => row.map((field) => `"${field}"`).join(","))].join(
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
    return NextResponse.json({ error: "Failed to export subsidiaries" }, { status: 500 })
  }
}
