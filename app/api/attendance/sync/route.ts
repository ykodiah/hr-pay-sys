import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// API endpoint for biometric device sync
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { device_id, records } = body

    if (!device_id || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    // Verify device exists
    const { data: device, error: deviceError } = await supabase
      .from("biometric_devices")
      .select("*")
      .eq("device_id", device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Process and insert records
    const processedRecords = records.map((record) => ({
      employee_id: record.employee_id,
      date: record.date,
      clock_in: record.clock_in,
      clock_out: record.clock_out,
      device_id: device.id,
      company_id: device.company_id,
      status: record.clock_in ? "present" : "absent",
    }))

    const { data, error } = await supabase
      .from("attendance_records")
      .upsert(processedRecords, {
        onConflict: "employee_id,date",
      })
      .select()

    if (error) throw error

    // Update device sync status
    await supabase
      .from("biometric_devices")
      .update({
        last_sync: new Date().toISOString(),
        total_records: device.total_records + records.length,
        is_online: true,
      })
      .eq("id", device.id)

    return NextResponse.json({
      success: true,
      synced: data.length,
      message: `Successfully synced ${data.length} records`,
    })
  } catch (error) {
    console.error("[v0] Error syncing attendance:", error)
    return NextResponse.json({ error: "Failed to sync attendance records" }, { status: 500 })
  }
}
