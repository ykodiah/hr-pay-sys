import { type NextRequest, NextResponse } from "next/server"
import { taxAPIService } from "@/lib/tax-api-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countries = searchParams.get("countries")?.split(",") || ["ghana", "nigeria"]

    console.log("[v0] API: Checking for tax rate updates...")

    const updates = await taxAPIService.checkForUpdates(countries)

    return NextResponse.json({
      success: true,
      updates,
      timestamp: new Date().toISOString(),
      countries: countries,
    })
  } catch (error) {
    console.error("[v0] API: Failed to check tax updates:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check for tax rate updates",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
