import { type NextRequest, NextResponse } from "next/server"
import { taxAPIService } from "@/lib/tax-api-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country")

    if (!country) {
      return NextResponse.json(
        {
          success: false,
          error: "Country parameter is required",
        },
        { status: 400 },
      )
    }

    console.log(`[v0] API: Testing connectivity for ${country}...`)

    const isConnected = await taxAPIService.testConnectivity(country)

    return NextResponse.json({
      success: true,
      country,
      connected: isConnected,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] API: Connectivity test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Connectivity test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
