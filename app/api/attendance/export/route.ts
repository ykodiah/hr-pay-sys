import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const format = searchParams.get("format") || "csv"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Get current user's company
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: employee } = await supabase.from("employees").select("company_id").eq("id", user.id).single()

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Fetch attendance records
    let query = supabase
      .from("attendance_records")
      .select(`
        *,
        employee:employees(full_name, employee_id, department)
      `)
      .eq("company_id", employee.company_id)
      .order("date", { ascending: false })

    if (startDate) query = query.gte("date", startDate)
    if (endDate) query = query.lte("date", endDate)

    const { data: records, error } = await query

    if (error) throw error

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Date",
        "Employee ID",
        "Employee Name",
        "Department",
        "Clock In",
        "Clock Out",
        "Total Hours",
        "Overtime Hours",
        "Status",
        "Notes",
      ]

      const rows = records.map((r) => [
        r.date,
        r.employee?.employee_id || "",
        r.employee?.full_name || "",
        r.employee?.department || "",
        r.clock_in || "",
        r.clock_out || "",
        r.total_hours || 0,
        r.overtime_hours || 0,
        r.status,
        r.notes || "",
      ])

      const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendance-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // Return JSON
    return NextResponse.json(records)
  } catch (error) {
    console.error("[v0] Error exporting attendance:", error)
    return NextResponse.json({ error: "Failed to export attendance records" }, { status: 500 })
  }
}
