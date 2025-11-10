import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateAttendancePDF } from "@/lib/attendance/pdf-generator"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { reportType, filters } = body

  // Get company info
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id, subsidiary_id")
    .eq("id", user.id)
    .single()

  const { data: company } = await supabase.from("companies").select("*").eq("id", profile?.company_id).single()

  let subsidiary = null
  if (profile?.subsidiary_id) {
    const { data } = await supabase.from("subsidiaries").select("*").eq("id", profile.subsidiary_id).single()
    subsidiary = data
  }

  // Get attendance records
  let query = supabase
    .from("attendance_records")
    .select(`
      *,
      employee:employees(
        id,
        full_name,
        employee_id,
        department,
        division,
        location
      )
    `)
    .order("clock_in", { ascending: false })

  if (filters.startDate) query = query.gte("clock_in", filters.startDate)
  if (filters.endDate) query = query.lte("clock_in", filters.endDate)

  const { data: records } = await query

  // Filter by department/division/location
  let filtered = records || []
  if (filters.department) filtered = filtered.filter((r) => r.employee?.department === filters.department)
  if (filters.division) filtered = filtered.filter((r) => r.employee?.division === filters.division)
  if (filters.location) filtered = filtered.filter((r) => r.employee?.location === filters.location)

  // Generate PDF
  const pdfBlob = await generateAttendancePDF(filtered, reportType, { company, subsidiary }, filters)

  return new NextResponse(pdfBlob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportType}-${Date.now()}.pdf"`,
    },
  })
}
