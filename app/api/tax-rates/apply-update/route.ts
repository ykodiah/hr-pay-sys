import { type NextRequest, NextResponse } from "next/server"
import { taxAPIService } from "@/lib/tax-api-service"

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    console.log(`[v0] API: Applying tax update for ${update.country} ${update.taxYear}...`)

    const success = await taxAPIService.applyTaxUpdate(update)

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Tax rates updated successfully for ${update.country} ${update.taxYear}`,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to apply tax rate update",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] API: Failed to apply tax update:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to apply tax rate update",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
