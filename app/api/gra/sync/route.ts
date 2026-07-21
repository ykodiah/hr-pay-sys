/**
 * GRA catalog sync — uses the official local GRA personal-tax-relief catalog.
 * External GRA developer API is not required; sync works from our curated source
 * (https://gra.gov.gh/domestic-tax/personal-tax-relief/).
 */

import { NextRequest, NextResponse } from "next/server"
import { graApiService } from "@/lib/gra-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { apiKey, action = "get_comprehensive_reliefs" } = body || {}

    if (apiKey) {
      graApiService.setApiKey(apiKey)
    }

    switch (action) {
      case "test_connection": {
        // Always succeed for local official catalog — no external key required.
        let remoteOk = false
        if (apiKey) {
          try {
            remoteOk = await graApiService.testConnection()
          } catch {
            remoteOk = false
          }
        }
        return NextResponse.json({
          success: true,
          message: remoteOk
            ? "Connected to GRA API"
            : "Using Akwaaba official GRA tax-relief catalog (no external API key required)",
          data: {
            isConnected: true,
            mode: remoteOk ? "remote" : "local_catalog",
            source: "https://gra.gov.gh/domestic-tax/personal-tax-relief/",
          },
        })
      }

      case "sync_reliefs":
      case "get_comprehensive_reliefs":
      case "auto_sync": {
        // Prefer local official catalog for reliability; optionally enrich from remote.
        const comprehensiveReliefs = await graApiService.getComprehensiveTaxReliefs()
        const lastSync = new Date().toISOString()
        graApiService.getSyncStatus().isConnected = true
        return NextResponse.json({
          success: true,
          data: {
            taxReliefs: comprehensiveReliefs,
            taxRates: [],
          },
          lastSync,
          totalReliefs: comprehensiveReliefs.length,
          totalRates: 0,
          mode: "local_catalog",
          source: "https://gra.gov.gh/domestic-tax/personal-tax-relief/",
        })
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 })
    }
  } catch (error) {
    console.error("GRA API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const syncStatus = graApiService.getSyncStatus()
    const reliefs = await graApiService.getComprehensiveTaxReliefs()
    return NextResponse.json({
      success: true,
      data: {
        ...syncStatus,
        isConnected: true,
        mode: "local_catalog",
        catalogCount: reliefs.length,
        source: "https://gra.gov.gh/domestic-tax/personal-tax-relief/",
      },
    })
  } catch (error) {
    console.error("GRA Status Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
